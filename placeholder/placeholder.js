document.addEventListener('DOMContentLoaded', place);

function place() {
    // Replace all images with the attribute data-place
    var images = document.querySelectorAll("img[data-place]");

    for (var i = 0; i < images.length; i++) {
        let image = images[i];

        let newImage = image.cloneNode();

        // Set up container div to hold placeholder

        let container = document.createElement("div");
        container.style.display = "inline-block";

        // Add a canvas above the div

        let canvas = document.createElement("canvas");
        canvas.style.position = "absolute";
        canvas.style.zIndex = 99;
        canvas.style.transition = "opacity 1s";

        container.appendChild(canvas);
        container.appendChild(newImage);

        image.parentNode.replaceChild(container, image);

        var xhr = new XMLHttpRequest();

        // Look for an asset with the same name and the extension .tri

        let name = image.dataset.place.replace(/\.[^/.]+$/, ".tri");

        xhr.open("GET", name, true);
        xhr.responseType = "arraybuffer";

        xhr.onreadystatechange = () => {
            var buffer = xhr.response;
            if (buffer) {
                var data = new DataView(buffer);
                let width = data.getUint16(0, true);
                let height = data.getUint16(2, true);

                let numPoints = data.getUint16(4, true);

                canvas.width = width;
                canvas.height = height;

                // Set width and height of placeholders

                let w = newImage.width;
                let h = newImage.height;

                w = w || h * (width / height);
                h = h || w * (height / width);

                if (!w && !h) {
                    w = width;
                    h = height;
                }

                container.style.width = w + "px"
                container.style.height = h + "px"

                canvas.style.width = w + "px";
                canvas.style.height = h + "px";

                // Render data

                var ctx = canvas.getContext("2d", {
                    alpha: false,
                });

                ctx.clearRect(0, 0, width, height);

                ctx.globalCompositeOperation = "lighter";

                for (var i = 6 + numPoints * 4; i < buffer.byteLength; i += 9) {
                    let points = [data.getUint16(i, true), data.getUint16(i + 2, true), data.getUint16(i + 4, true)];

                    let triangle = [
                        [data.getUint16(6 + points[0] * 4, true), data.getUint16(8 + points[0] * 4, true)],
                        [data.getUint16(6 + points[1] * 4, true), data.getUint16(8 + points[1] * 4, true)],
                        [data.getUint16(6 + points[2] * 4, true), data.getUint16(8 + points[2] * 4, true)],
                    ];
                    let color = [data.getUint8(i + 6, true), data.getUint8(i + 7, true), data.getUint8(i + 8, true)]

                    ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;

                    ctx.beginPath();
                    ctx.moveTo(triangle[0][0], triangle[0][1]);
                    ctx.lineTo(triangle[1][0], triangle[1][1]);
                    ctx.lineTo(triangle[2][0], triangle[2][1]);
                    ctx.closePath();
                    ctx.fill();
                }
            }
        };
        xhr.send();

        // Load the original image
        newImage.src = newImage.dataset.place;

        newImage.onload = function () {
            canvas.style.opacity = "0"; // Hide the canvas after the image is loaded
        }

    }
}