const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow

let main_editor, focus_window, initial_geom = false;

function start() {
    // Iterate backwards so first page ends up with focus
    for(var i = process.argv.length - 1; i >= 2; i--){
        let win = new BrowserWindow({width:0, height: 0, x: 0, y: 0,
                                     acceptFirstMouse: true, show: false,
                                     webPreferences: {nativeWindowOpen: true}});
        win.loadURL(process.argv[i], {extraHeaders: 'pragma: no-cache\n'});
        main_editor = win;
    }

    main_editor.focus();
    main_editor.on('closed', function () {
        main_editor = null;
        app.quit();
    });

    update_mouse();
}

// Capture mouse's screen position every 10ms and send to Python
function update_mouse(){
    if(main_editor !== null){
        let cursor = electron.screen.getCursorScreenPoint();
        let js_code = `eel.update_mouse_position(${cursor.x}, ${cursor.y})`;
        main_editor.webContents.executeJavaScript(js_code);
        setTimeout(update_mouse, 10);
    }
}

// Send window position and size to Python
function update_bounds(w){
    if(w.isFocused()){
        let bounds = w.getBounds();
        let js_code = `update_position(${bounds.x}, ${bounds.y})`;
        w.webContents.executeJavaScript(js_code);
    }
}

app.on('browser-window-created', function(e, w){
    if(w.isVisible()){
        w.on('move', () => update_bounds(w));
        w.on('resize', () => update_bounds(w));
    } else {
        w.once('ready-to-show', () => {
            w.show();
            w.on('move', () => update_bounds(w));
            w.on('resize', () => update_bounds(w));
        });
    }
});

app.on('ready', start);