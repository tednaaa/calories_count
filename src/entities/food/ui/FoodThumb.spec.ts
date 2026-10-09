import { flushPromises, mount } from '@vue/test-utils';
import FoodThumb from './FoodThumb.vue';

function mountThumb(props: { name: string; photo?: string; foodId?: string; zoomable?: boolean }) {
	return mount(FoodThumb, { props, global: { stubs: { teleport: false } } });
}

function zoomedPhoto() {
	return document.querySelector('[data-slot="dialog-content"] img');
}

describe('food thumbnail', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('shows the first letter of the name without a photo', () => {
		expect(mountThumb({ name: 'конфета' }).text()).toBe('К');
	});

	it('opens the photo enlarged on tap', async () => {
		const wrapper = mountThumb({ name: 'Кебаб', photo: 'data:image/webp;base64,photo', zoomable: true });

		await wrapper.find('img').trigger('click');
		await flushPromises();

		expect(zoomedPhoto()?.getAttribute('src')).toBe('data:image/webp;base64,photo');
	});

	it('takes the photo from the catalog', async () => {
		const wrapper = mountThumb({ name: 'Ангус-кебаб', foodId: 'angus-kebab', zoomable: true });

		await wrapper.find('img').trigger('click');
		await flushPromises();

		expect(zoomedPhoto()?.getAttribute('src')).toBe('/foods/angus-kebab.webp');
	});

	it('stays a plain image when zoom is not allowed', async () => {
		const wrapper = mountThumb({ name: 'Кебаб', photo: 'data:image/webp;base64,photo' });

		await wrapper.find('img').trigger('click');
		await flushPromises();

		expect(zoomedPhoto()).toBeNull();
	});

	it('does not enlarge the placeholder without a photo', async () => {
		const wrapper = mountThumb({ name: 'Конфета', zoomable: true });

		await wrapper.find('div').trigger('click');
		await flushPromises();

		expect(zoomedPhoto()).toBeNull();
	});
});
