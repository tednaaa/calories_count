<script setup lang="ts">
import type { Decoder } from '../lib/decoder';
import { XIcon } from '@lucide/vue';
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';
import { isBarcode } from '@/entities/food';
import { createDecoder } from '../lib/decoder';

const emit = defineEmits<{ found: [code: string]; close: [] }>();

const FRAME_INTERVAL = 300;

const video = useTemplateRef<HTMLVideoElement>('video');
const failure = ref('');

let stream: MediaStream | undefined;
let timer: ReturnType<typeof setInterval> | undefined;
let canvas: HTMLCanvasElement | undefined;

function frameOf(source: HTMLVideoElement): ImageData | undefined {
  canvas ??= document.createElement('canvas');
  canvas.width = source.videoWidth;
  canvas.height = source.videoHeight;

  const context = canvas.getContext('2d', { willReadFrequently: true });

  context?.drawImage(source, 0, 0);

  return context?.getImageData(0, 0, canvas.width, canvas.height);
}

async function scan(decoder: Decoder) {
  const source = video.value;

  if (!source?.videoWidth) {
    return;
  }

  const frame = frameOf(source);
  const code = frame && await decoder(frame);

  if (code && isBarcode(code)) {
    emit('found', code);
  }
}

async function start() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
  }
  catch {
    failure.value = 'Не получилось включить камеру. Проверь разрешение в настройках браузера.';

    return;
  }

  if (video.value) {
    video.value.srcObject = stream;
    await video.value.play();
  }

  let decoder: Decoder;

  try {
    decoder = await createDecoder();
  }
  catch (error) {
    console.error('[createDecoder]', error);
    failure.value = 'Не удалось загрузить распознавание кода. Нужен интернет для первого раза.';

    return;
  }

  timer = setInterval(() => void scan(decoder), FRAME_INTERVAL);
}

onMounted(start);

onBeforeUnmount(() => {
  clearInterval(timer);
  stream?.getTracks().forEach(track => track.stop());
});
</script>

<template>
  <div class="fixed inset-0 z-50 flex flex-col bg-black">
    <video ref="video" playsinline muted class="min-h-0 flex-1 object-cover" />

    <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div class="h-32 w-64 rounded-2xl border-2 border-white/80" />
    </div>

    <button
      type="button"
      class="absolute top-4 right-4 flex size-11 items-center justify-center rounded-full bg-black/50 text-white"
      aria-label="Закрыть камеру"
      @click="emit('close')"
    >
      <XIcon class="size-5" />
    </button>

    <p class="absolute inset-x-0 bottom-0 p-6 text-center text-sm text-white">
      {{ failure || 'Наведи на штрих-код на упаковке' }}
    </p>
  </div>
</template>
