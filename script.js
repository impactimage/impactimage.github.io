const colors = [0xFFFFFF, 0xFF2121, 0xFF93C4, 0xFF8135, 0xFFF609, 0x249CA3, 0x78DC52, 0x003FAD, 0x87F2FF, 0x8E2EC4, 0xA4839F, 0x5C406C, 0xE5CDC4, 0x91463D, 0x000000];

const palette = document.querySelector('#palette');
for (const color of colors) {
	palette.appendChild(Object.assign(document.createElement('input'), {
		type: 'color',
		value: `#${color.toString(16)}`
	}));
}

const field = document.querySelector('#field');

document.addEventListener('paste', ({ clipboardData: { items } }) => {
	for (let item of items) {
		if (item.kind === 'file') {
			const reader = new FileReader;
			reader.addEventListener('load', ({ target: { result } }) => {
				const canvas = document.createElement('canvas');
				const ctx = canvas.getContext('2d');
				const image = new Image;
				image.addEventListener('load', () => {
					const sw = image.naturalWidth;
					const sh = image.naturalHeight;
					const dw = document.querySelector('#input-width').value;
					const dh = document.querySelector('#input-height').value;
					canvas.width = dw;
					canvas.height = dh;
					ctx.drawImage(image, 0, 0, sw, sh, 0, 0, dw, dh);
					const { data } = ctx.getImageData(0, 0, dw, dh);
					field.value = 'img`';
					for (let y = 0; y < dh; ++y) {
						for (let x = 0; x < dw; ++x) {
							const i = (y * dw + x) * 4;
							const [r, g, b, a] = data.slice(i, i + 4);
							let closest = 0;
							let leastDiff = Infinity;
							if (a > 127) {
								for (let [index, color] of Object.entries(colors)) {
									const diff = (r - (color >> 16)) ** 2 + (g - ((color >> 8) & 0xFF)) ** 2 + (b - (color & 0xFF)) ** 2;
									if (diff < leastDiff) {
										leastDiff = diff;
										closest = index;
									}
								}
								++closest;
							}
							field.value += closest.toString(16);
						}
						field.value += '\n';
					}
					field.value += '`';
				});
				image.src = result;
			});
			reader.readAsDataURL(item.getAsFile());
		}
	}
});

// TODO
document.querySelector('#button-infer-palette').addEventListener('click', () => {

});
