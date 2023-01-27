importScripts('wasm_exec.js');

self.addEventListener('message', function (event) {
    var {eventData} = event.data
    var go = new Go();
    var data = JSON.parse(eventData);
    WebAssembly.instantiateStreaming(fetch("lib.wasm"), go.importObject).then((result) => {
        go.run(result.instance);
        initAlgorithm(data.image, data.points);
        while (true) {
            postMessage({
                message: {renderData: renderAlgorithm()}
            });
            runAlgorithm();
        }
    });
})