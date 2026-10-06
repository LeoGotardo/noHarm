package com.noharm.appupdater;

import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.activity.result.ActivityResult;
import androidx.core.content.FileProvider;
import androidx.core.content.pm.PackageInfoCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * Updates the APK published on GitHub Releases (the app is not on the Play
 * Store).
 *
 * The JS side (src/services/appUpdate.js) asks GitHub for the latest release
 * and decides whether it is newer; this holds only what the WebView cannot do:
 * read the installed versionCode, download the APK without CORS, and hand it to
 * the Android installer — via the "install unknown apps" permission first, on
 * Android 8+.
 */
@CapacitorPlugin(name = "AppUpdater")
public class AppUpdaterPlugin extends Plugin {

    private static final String APK_MIME = "application/vnd.android.package-archive";
    private static final String UPDATE_DIR = "updates";
    private static final int TIMEOUT_MS = 30_000;
    private static final int PROGRESS_STEP_BYTES = 256 * 1024;

    @PluginMethod
    public void getInfo(PluginCall call) {
        try {
            PackageInfo info = getContext().getPackageManager()
                .getPackageInfo(getContext().getPackageName(), 0);
            boolean debuggable = (getContext().getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0;
            JSObject ret = new JSObject();
            ret.put("versionName", info.versionName);
            ret.put("versionCode", PackageInfoCompat.getLongVersionCode(info));
            ret.put("debug", debuggable);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("could not read the installed version", e);
        }
    }

    /** Before Android 8 the permission is global and the installer itself warns. */
    @PluginMethod
    public void canInstall(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("granted", canRequestInstalls());
        call.resolve(ret);
    }

    /** Opens this app's "install unknown apps" screen; resolves when the user comes back. */
    @PluginMethod
    public void openInstallSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
            return;
        }
        Intent intent = new Intent(
            Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
            Uri.parse("package:" + getContext().getPackageName())
        );
        startActivityForResult(call, intent, "onInstallSettingsResult");
    }

    @ActivityCallback
    private void onInstallSettingsResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        JSObject ret = new JSObject();
        ret.put("granted", canRequestInstalls());
        call.resolve(ret);
    }

    /** Downloads the APK into the cache, emitting `downloadProgress` ({ loaded, total }). */
    @PluginMethod
    public void download(PluginCall call) {
        String url = call.getString("url");
        String fileName = call.getString("fileName", "update.apk");
        if (url == null || !url.startsWith("https://")) {
            call.reject("invalid url");
            return;
        }
        // The name only: the JS must not be able to write outside the updates folder.
        String safeName = new File(fileName).getName();

        getBridge().execute(() -> {
            File dir = new File(getContext().getCacheDir(), UPDATE_DIR);
            File target = new File(dir, safeName);
            HttpURLConnection conn = null;
            try {
                if (!dir.exists() && !dir.mkdirs()) throw new Exception("could not create " + dir);
                // Leftovers from earlier downloads — one APK at a time is enough.
                File[] old = dir.listFiles();
                if (old != null) for (File f : old) f.delete();

                // GitHub's download link redirects (https → https), which HttpURLConnection follows.
                conn = (HttpURLConnection) new URL(url).openConnection();
                conn.setConnectTimeout(TIMEOUT_MS);
                conn.setReadTimeout(TIMEOUT_MS);
                conn.setInstanceFollowRedirects(true);
                int status = conn.getResponseCode();
                if (status != HttpURLConnection.HTTP_OK) throw new Exception("HTTP " + status);

                long total = conn.getContentLengthLong();
                long loaded = 0;
                long lastNotified = 0;
                try (InputStream in = conn.getInputStream(); OutputStream out = new FileOutputStream(target)) {
                    byte[] buffer = new byte[64 * 1024];
                    int read;
                    while ((read = in.read(buffer)) != -1) {
                        out.write(buffer, 0, read);
                        loaded += read;
                        if (loaded - lastNotified >= PROGRESS_STEP_BYTES) {
                            lastNotified = loaded;
                            notifyProgress(loaded, total);
                        }
                    }
                }
                notifyProgress(loaded, total);
                if (total > 0 && loaded != total) throw new Exception("incomplete download");

                JSObject ret = new JSObject();
                ret.put("path", target.getAbsolutePath());
                call.resolve(ret);
            } catch (Exception e) {
                target.delete();
                call.reject("could not download the update: " + e.getMessage(), e);
            } finally {
                if (conn != null) conn.disconnect();
            }
        });
    }

    /** Hands the downloaded APK to the system installer, which asks for confirmation. */
    @PluginMethod
    public void install(PluginCall call) {
        String path = call.getString("path");
        File apk = path == null ? null : new File(path);
        File dir = new File(getContext().getCacheDir(), UPDATE_DIR);
        if (apk == null || !apk.isFile() || !dir.equals(apk.getParentFile())) {
            call.reject("APK not found");
            return;
        }
        if (!canRequestInstalls()) {
            call.reject("permission to install from this source not granted", "PERMISSION");
            return;
        }
        try {
            Uri uri = FileProvider.getUriForFile(
                getContext(), getContext().getPackageName() + ".appupdater.fileprovider", apk
            );
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(uri, APK_MIME);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            getActivity().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("could not open the installer", e);
        }
    }

    private boolean canRequestInstalls() {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.O
            || getContext().getPackageManager().canRequestPackageInstalls();
    }

    private void notifyProgress(long loaded, long total) {
        JSObject data = new JSObject();
        data.put("loaded", loaded);
        data.put("total", total);
        notifyListeners("downloadProgress", data);
    }
}
