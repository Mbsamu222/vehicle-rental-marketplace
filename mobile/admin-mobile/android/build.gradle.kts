allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

val newBuildDir: Directory =
    rootProject.layout.buildDirectory
        .dir("../../build")
        .get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}
// Some plugins (file_picker, at the version resolved here) still declare
// compileSdk 34, while others (flutter_plugin_android_lifecycle) require their
// consumers to compile against 36. Gradle fails the build on that mismatch, so
// raise any Android subproject that is behind. This must be registered before
// the evaluationDependsOn(":app") block below, which forces evaluation and
// would make a later afterEvaluate too late to run.
subprojects {
    afterEvaluate {
        val android = extensions.findByName("android") as? com.android.build.gradle.BaseExtension
        val current = android?.compileSdkVersion?.removePrefix("android-")?.toIntOrNull()
        if (android != null && current != null && current < 36) {
            android.compileSdkVersion(36)
        }
    }
}
subprojects {
    project.evaluationDependsOn(":app")
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
