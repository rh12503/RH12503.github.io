window.addEventListener('load', place);

function place() {
    // Replace all images with the attribute data-src
    var images = document.querySelectorAll("img[data-src]");

    for (var i = 0; i < images.length; i++) {
        let image = images[i];

        var backgroundSize = "contain"
        switch (window.getComputedStyle(image).objectFit) {
            case "cover":
                backgroundSize = "cover"
                break
            case "fill":
                backgroundSize = "100% 100%"
                break
            case "none":
                backgroundSize = "auto"
                break
        }
        image.style.backgroundPosition = window.getComputedStyle(image).objectPosition;
        image.style.backgroundSize = backgroundSize
        image.style.opacity = "0"
        image.style.backgroundRepeat = "no-repeat"
        image.style.transition = "background 0.7s, background-position 0s, background-size 0s"

        var xhr = new XMLHttpRequest();

        // Look for an asset with the same name and the extension .tri

        let name = image.dataset.src.replace(/\.[^/.]+$/, ".tri");

        xhr.open("GET", name, true);
        xhr.responseType = "arraybuffer";

        xhr.onreadystatechange = (resp) => {
            var buffer = resp.currentTarget.response;

            if (buffer) {

                var data = new DataView(buffer);
                let triangles = parseData(data);
                let width = data.getUint16(0, true);
                let height = data.getUint16(2, true);

                let canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                var blank = canvas.toDataURL();

                var ctx = canvas.getContext("2d")
                ctx.clearRect(0, 0, width, height)

                for (var i = 0; i < triangles.length; i++) {
                    let triangle = triangles[i].triangle
                    let color = triangles[i].color
                    let rgb = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
                    ctx.fillStyle = rgb;
                    ctx.strokeStyle = rgb;
                    ctx.lineWidth = 1;

                    ctx.beginPath();
                    ctx.moveTo(triangle[0][0], triangle[0][1]);
                    ctx.lineTo(triangle[1][0], triangle[1][1]);
                    ctx.lineTo(triangle[2][0], triangle[2][1]);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }

                var imageXhr = new XMLHttpRequest();
                imageXhr.open("GET", image.dataset.src, true);
                imageXhr.responseType = "blob";
                imageXhr.onreadystatechange = (response) => {
                    var blob = response.currentTarget.response
                    if (blob) {
                        var reader = new FileReader();
                        reader.onloadend = function () {
                            image.style.backgroundImage = `url(${reader.result})`
                            image.ontransitionend = () => {
                                image.src = reader.result
                                image.style.backgroundImage = ''
                            };
                        }
                        reader.readAsDataURL(response.currentTarget.response);
                    }
                }
                imageXhr.send()
                image.src = blank;
                image.style.backgroundImage = `url('${canvas.toDataURL("image/jpeg")}')`
                image.style.opacity = "1"
            }
        };
        xhr.send();

    }
}

function parseData(data) {
    var triangles = [];

    triangles.push({
        triangle: [
            [data.getUint16(5, true), data.getUint16(7, true)],
            [data.getUint16(9, true), data.getUint16(11, true)],
            [data.getUint16(13, true), data.getUint16(15, true)],
        ],
        color: [data.getUint8(17, true), data.getUint8(18, true), data.getUint8(19, true)],
        remaining: data.getUint8(4, true),
    });

    var current = 0;

    for (var i = 20; i < data.byteLength; i += 8) {
        let face = data.getUint8(i, true) % 3

        let adjacent = triangles[current].triangle;

        triangles.push({
            triangle: [
                adjacent[face],
                adjacent[(face + 1) % 3],
                [data.getUint16(i + 1, true), data.getUint16(i + 3, true)],
            ].sort(function (a, b) {
                if (a[1] == b[1]) {
                    return a[0] - b[0];
                }

                return a[1] - b[1];
            }),
            color: [data.getUint8(i + 5, true), data.getUint8(i + 6, true), data.getUint8(i + 7, true)],
            remaining: Math.floor(data.getUint8(i, true) / 3),
        });

        triangles[current].remaining--;
        while (triangles[current] && triangles[current].remaining == 0) {
            current++;
        }
    }
    return triangles
}