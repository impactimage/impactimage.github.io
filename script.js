const display = document.querySelector('#preview > canvas');
const palette = document.querySelector('#palette');
const width = document.querySelector('#input-width');
const height = document.querySelector('#input-height');
const button_copy = document.querySelector('#button-copy');

const colors = [0xFFFFFF, 0xFF2121, 0xFF93C4, 0xFF8135, 0xFFF609, 0x249CA3, 0x78DC52, 0x003FAD, 0x87F2FF, 0x8E2EC4, 0xA4839F, 0x5C406C, 0xE5CDC4, 0x91463D, 0x000000];
let closest_colors = Object.hasOwn(localStorage, 'closest_colors')
	? JSON.parse(localStorage.getItem('closest_colors'))
	: "".split('').map((x) => x.charCodeAt(0));
function to_rgb(color) {
	return [(color >> 16) & 255, (color >> 8) & 255, color & 255];
}
function from_rgb(r, g, b) {
	return ((r & 255) << 16) | ((g & 255) << 8) | (b & 255);
}
function closest_color_index(r, g, b, a) {
	return +(a > 127) && (closest_colors[from_rgb(r, g, b)] ??= (() => {
		let least_index = 0;
		let least_diff = Infinity;
		for (const [index, [r2, g2, b2]] of Object.entries(colors.map(to_rgb))) {
			let diff = (r - r2) ** 2 + (g - g2) ** 2 + (b - b2) ** 2;
			if (diff < least_diff) {
				least_diff = diff;
				least_index = +index;
			}
		}
		return 1 + least_index;
	})());
}

const output = {
	width: width.value,
	height: height.value,
	data: []
};

function render_preview() {
	document.querySelector('#preview').style.display = 'block';
	const canvas = document.querySelector('#preview > canvas');
	canvas.width = screen.width / 4;
	canvas.height = canvas.width / output.width * output.height;
	const ctx = canvas.getContext('2d');
	const pixel_size = canvas.width / output.width;
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	for (let y = 0; y < output.height; ++y) {
		for (let x = 0; x < output.width; ++x) {
			const index = output.data[y * output.width + x];
			if (index) {
				ctx.fillStyle = `#${colors[index - 1].toString(16).padStart(6, '0')}`;
				ctx.fillRect(x * pixel_size, y * pixel_size, pixel_size + 1, pixel_size + 1);
			}
		}
	}
}

const image = new Image;
function convert() {
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');
	const sw = image.naturalWidth;
	const sh = image.naturalHeight;
	const dw = canvas.width = output.width;
	const dh = canvas.height = output.height;
	ctx.drawImage(image, 0, 0, sw, sh, 0, 0, dw, dh);
	const { data } = ctx.getImageData(0, 0, dw, dh);
	output.data = [];
	for (let y = 0; y < dh; ++y) {
		for (let x = 0; x < dw; ++x) {
			const i = (y * dw + x) * 4;
			output.data.push(closest_color_index(...data.slice(i, i + 4)));
		}
	}
	render_preview();
}

document.addEventListener('paste', ({ clipboardData: { items: files } }) => {
	for (const file of files) {
		if (file.kind === 'file') {
			const reader = new FileReader;
			reader.addEventListener('load', ({ target: { result: src } }) => {
				image.src = src;
			});
			reader.readAsDataURL(file.getAsFile());
			break;
		}
	}
});
image.addEventListener('load', () => {
	convert();
});
width.addEventListener('change', ({ target: { value } }) => {
	output.width = value;
	convert();
});
height.addEventListener('change', ({ target: { value } }) => {
	output.height = value;
	convert();
});
for (const [index, color] of Object.entries(colors)) {
	palette.appendChild(Object.assign(document.createElement('input'), {
		type: 'color',
		value: `#${color.toString(16).padStart(6, '0')}`
	})).addEventListener('change', ({ target: { value } }) => {
		colors[index] = value;
		closest_colors = {};
		convert();
	});
}
button_copy.addEventListener('click', () => {
	let text = 'img`';
	for (let y = 0; y < output.height; ++y) {
		for (let x = 0; x < output.width; ++x) {
			text += output.data[y * output.width + x].toString(16) + ' ';
		}
		text += '\n';
	}
	navigator.clipboard.writeText(text + '`');
});
