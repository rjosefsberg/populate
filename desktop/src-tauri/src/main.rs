// Populate desktop shell: starts the bundled Flask backend as a sidecar
// process, waits for it to come up, then opens a window pointed at it.
// The sidecar is killed automatically when the app exits.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::net::TcpStream;
use std::time::{Duration, Instant};
use tauri::Manager;
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandEvent;

const BACKEND_ADDR: &str = "127.0.0.1:5000";
const BACKEND_URL: &str = "http://127.0.0.1:5000";

fn wait_for_backend(timeout: Duration) -> bool {
    let start = Instant::now();
    while start.elapsed() < timeout {
        if TcpStream::connect(BACKEND_ADDR).is_ok() {
            return true;
        }
        std::thread::sleep(Duration::from_millis(150));
    }
    false
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let shell = app.shell();
            let sidecar = shell
                .sidecar("populate-backend")
                .expect("failed to resolve populate-backend sidecar");
            let (mut rx, _child) = sidecar.spawn().expect("failed to spawn backend sidecar");

            // Drain output so the child doesn't block on a full pipe; log
            // to stdout so `cargo tauri build --debug` runs stay visible.
            tauri::async_runtime::spawn(async move {
                while let Some(event) = rx.recv().await {
                    match event {
                        CommandEvent::Stdout(line) => print!("{}", String::from_utf8_lossy(&line)),
                        CommandEvent::Stderr(line) => eprint!("{}", String::from_utf8_lossy(&line)),
                        _ => {}
                    }
                }
            });

            if !wait_for_backend(Duration::from_secs(15)) {
                eprintln!("backend did not come up in time; opening window anyway");
            }

            let window = tauri::WebviewWindowBuilder::new(
                app,
                "main",
                tauri::WebviewUrl::External(BACKEND_URL.parse().unwrap()),
            )
            .title("Populate")
            .inner_size(1280.0, 840.0)
            .build()?;
            window.set_focus().ok();

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running populate");
}
