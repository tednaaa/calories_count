import { flushPromises, mount } from '@vue/test-utils';
import FoodThumb from './FoodThumb.vue';

function mountThumb(props: { name: string; photo?: string; foodId?: string; zoomable?: boolean }) {
  return mount(FoodThumb, { props, global: { stubs: { teleport: false } } });
}

function zoomedPhoto() {
  return document.querySelector('[data-slot="dialog-content"] img');
}

describe('превью блюда', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('без фото показывает первую букву названия', () => {
    expect(mountThumb({ name: 'конфета' }).text()).toBe('К');
  });

  it('тап по фото открывает его крупно', async () => {
    const wrapper = mountThumb({ name: 'Кебаб', photo: 'data:image/webp;base64,photo', zoomable: true });

    await wrapper.find('img').trigger('click');
    await flushPromises();

    expect(zoomedPhoto()?.getAttribute('src')).toBe('data:image/webp;base64,photo');
  });

  it('берёт фото из каталога', async () => {
    const wrapper = mountThumb({ name: 'Ангус-кебаб', foodId: 'angus-kebab', zoomable: true });

    await wrapper.find('img').trigger('click');
    await flushPromises();

    expect(zoomedPhoto()?.getAttribute('src')).toBe('/foods/angus-kebab.webp');
  });

  it('без разрешения на увеличение остаётся картинкой', async () => {
    const wrapper = mountThumb({ name: 'Кебаб', photo: 'data:image/webp;base64,photo' });

    await wrapper.find('img').trigger('click');
    await flushPromises();

    expect(zoomedPhoto()).toBeNull();
  });

  it('заглушку без фото не увеличивает', async () => {
    const wrapper = mountThumb({ name: 'Конфета', zoomable: true });

    await wrapper.find('div').trigger('click');
    await flushPromises();

    expect(zoomedPhoto()).toBeNull();
  });
});
