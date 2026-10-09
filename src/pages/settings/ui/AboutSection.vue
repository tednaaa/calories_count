<script setup lang="ts">
import { activeFoods } from '@/entities/food';

const version = __APP_VERSION__;
const builtAt = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'long', timeStyle: 'short' })
	.format(new Date(__BUILD_DATE__));
const catalogSize = activeFoods.length;
</script>

<template>
	<dl class="flex flex-col gap-2 text-sm">
		<div class="flex justify-between gap-4">
			<dt class="text-muted-foreground">
				Версия
			</dt>
			<dd class="tabular-nums text-foreground">
				{{ version }}
			</dd>
		</div>
		<div class="flex justify-between gap-4">
			<dt class="text-muted-foreground">
				Собрано
			</dt>
			<dd class="text-right text-foreground">
				{{ builtAt }}
			</dd>
		</div>
		<div class="flex justify-between gap-4">
			<dt class="text-muted-foreground">
				Блюд в каталоге
			</dt>
			<dd class="tabular-nums text-foreground">
				{{ catalogSize }}
			</dd>
		</div>
	</dl>
</template>
