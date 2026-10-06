package com.noharm.appupdater;

import androidx.core.content.FileProvider;

/**
 * A subclass only so the manifest can declare a second provider: two
 * `<provider>` entries naming androidx's FileProvider class would collide in
 * the merged manifest of the app.
 */
public class AppUpdaterFileProvider extends FileProvider {}
