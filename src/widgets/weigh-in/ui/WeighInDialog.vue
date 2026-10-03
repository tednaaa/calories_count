<script setup lang="ts">
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  toast,
} from 'shonk-ui';
import { computed, ref, watch } from 'vue';
import { recordWeight } from '@/entities/profile';
import { useWeighInReminder } from '@/entities/weight';
import { formatKg, parseKg, WEIGHT_LIMITS } from '@/shared/lib';

const props = defineProps<{ lastKg?: number }>();

const open = defineModel<boolean>('open', { required: true });

const { postpone } = useWeighInReminder();

const entered = ref('');
const saving = ref(false);

watch(open, (opened) => {
  if (opened) {
    entered.value = props.lastKg ? formatKg(props.lastKg) : '';
  }
}, { immediate: true });

const kg = computed(() => parseKg(entered.value));
const invalid = computed(() => entered.value.trim() !== '' && kg.value === null);

async function save() {
  if (kg.value === null) {
    return;
  }

  saving.value = true;

  try {
    await recordWeight(kg.value);
    toast('Вес записан');
    open.value = false;
  }
  finally {
    saving.value = false;
  }
}
function postponeWeighIn() {
  postpone();
  open.value = false;
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent>
      <DialogHeader :show-close-button="false">
        <DialogTitle>Взвешивание</DialogTitle>
      </DialogHeader>

      <form @submit.prevent="save">
        <DialogBody class="flex flex-col gap-4">
          <DialogDescription class="flex flex-col gap-1">
            <span>Взвешивайтесь в одно и то же время — лучше утром, после туалета, до еды.</span>
            <span>Не успели сегодня? Ничего страшного — взвесьтесь завтра.</span>
          </DialogDescription>

          <div class="flex flex-col gap-2">
            <Label for="weigh-in-kg">Вес, кг</Label>
            <Input id="weigh-in-kg" v-model="entered" inputmode="decimal" placeholder="85,4" :invalid="invalid" />
            <p v-if="invalid" class="text-xs text-warning">
              Вес — число от {{ WEIGHT_LIMITS.min }} до {{ WEIGHT_LIMITS.max }} кг.
            </p>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button type="button" variant="secondary" @click="postponeWeighIn">
            Взвешусь завтра
          </Button>
          <Button type="submit" :disabled="kg === null" :loading="saving">
            Сохранить
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
