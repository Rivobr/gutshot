# Keep WebView bridge if minify is enabled later.
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
