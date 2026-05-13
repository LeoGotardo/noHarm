const GeometricBg = () => (
  <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
    {/* Primary gradient orb */}
    <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/[0.04] blur-[100px]" />
    {/* Secondary warm orb */}
    <div className="absolute -bottom-40 -left-32 w-[500px] h-[500px] rounded-full bg-primary/[0.03] blur-[120px]" />
    {/* Center subtle glow */}
    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-primary/[0.015] blur-[150px]" />
    
    {/* Dot grid pattern */}
    <svg className="absolute inset-0 w-full h-full opacity-[0.025]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="dots" width="32" height="32" patternUnits="userSpaceOnUse">
          <circle cx="16" cy="16" r="1" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dots)" className="text-foreground" />
    </svg>

    {/* Floating accents */}
    <div className="absolute top-24 left-10 w-2 h-2 rounded-full bg-primary/15 animate-float-slow" />
    <div className="absolute top-48 right-14 w-1.5 h-1.5 rounded-full bg-primary/20 animate-float-mid" />
    <div className="absolute bottom-48 left-20 w-3 h-3 rounded-sm bg-primary/[0.06] rotate-45 animate-float-slow" />
    <div className="absolute top-72 right-24 w-2 h-2 rounded-full bg-success/10 animate-float-mid" />
    <div className="absolute bottom-64 right-10 w-2.5 h-2.5 rounded-full bg-primary/10 animate-float-slow" />
  </div>
);

export default GeometricBg;
