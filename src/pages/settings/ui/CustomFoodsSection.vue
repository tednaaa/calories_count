<script setup lang="ts">
import { Button } from 'shonk-ui';
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { useCustomFoods } from '@/entities/food';
import { pluralize } from '@/shared/lib';

const customFoods = useCustomFoods();

const counted = computed(() => (
  `${customFoods.value.length} ${pluralize(customFoods.value.length, ['блюдо', 'блюда', 'блюд'])}`
));
</script>

<template>
  <div class="flex flex-col gap-3">
    <p class="text-sm text-text-secondary">
      Заведено с телефона: {{ counted }}. Здесь их можно добавить, поправить и удалить.
    </p>

    <Button :as="RouterLink" to="/settings/foods" variant="outline">
      Открыть список
    </Button>
  </div>
</template>
