<script setup lang="ts">
import type { Backup, BackupMode } from '@/shared/db';
import { Button, downloadFile, toast, useConfirm } from 'shonk-ui';
import { ref, useTemplateRef } from 'vue';
import { useRouter } from 'vue-router';
import {
  applyBackup,
  backupFileName,
  collectBackup,
  describeBackup,
  readBackup,
  wipeAllData,
} from '@/shared/db';

const router = useRouter();
const confirmation = useConfirm();

const picker = useTemplateRef<HTMLInputElement>('picker');
const pending = ref<Backup | null>(null);
const busy = ref(false);

async function saveToFile() {
  const backup = await collectBackup();

  downloadFile(new Blob([JSON.stringify(backup)], { type: 'application/json' }), backupFileName());
}

async function pickFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  input.value = '';

  if (!file) {
    return;
  }

  const result = readBackup(await file.text());

  if (result.ok) {
    pending.value = result.backup;
  }
  else {
    toast(result.reason);
  }
}

async function restore(mode: BackupMode) {
  const backup = pending.value;

  if (!backup || busy.value) {
    return;
  }

  busy.value = true;

  try {
    await applyBackup(backup, mode);
    pending.value = null;
    toast('Копия загружена');
  }
  finally {
    busy.value = false;
  }
}

async function wipe() {
  await wipeAllData();
  await router.push('/');
}

function askToWipe() {
  confirmation.require({
    message: 'Профиль, дневник, свои блюда и история веса будут стёрты с этого телефона. Данные хранятся только здесь, восстановить их будет неоткуда — если копия ещё не выгружена, сначала сделай её.',
    acceptButtonText: 'Стереть',
    accept: () => {
      void wipe();
    },
  });
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <Button type="button" variant="outline" @click="saveToFile">
      Выгрузить копию
    </Button>

    <Button type="button" variant="outline" @click="picker?.click()">
      Загрузить копию
    </Button>

    <input
      ref="picker"
      type="file"
      accept="application/json,.json"
      class="hidden"
      @change="pickFile"
    >

    <div v-if="pending" class="flex flex-col gap-3 rounded-lg border border-border-default bg-bg-subtle p-4">
      <p class="text-sm text-text-primary">
        В файле {{ describeBackup(pending) }}.
      </p>
      <p class="text-xs text-text-tertiary">
        «Заменить всё» сотрёт то, что накоплено сейчас. «Дополнить» добавит записи к текущим, а профиль оставит нынешний.
      </p>

      <div class="grid grid-cols-2 gap-2">
        <Button type="button" variant="destructive" :loading="busy" @click="restore('replace')">
          Заменить всё
        </Button>
        <Button type="button" :loading="busy" @click="restore('merge')">
          Дополнить
        </Button>
      </div>

      <Button type="button" variant="ghost" @click="pending = null">
        Отмена
      </Button>
    </div>

    <Button type="button" variant="destructive" @click="askToWipe">
      Стереть все данные
    </Button>
  </div>
</template>
