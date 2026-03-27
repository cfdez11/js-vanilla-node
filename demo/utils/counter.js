import { reactive, computed } from "vex/reactive";

export const counter = reactive(77);

const stars = computed(() => Array.from({ length: counter.value }, () => "⭐"));

export function useCounter() {
  function increment() {
    counter.value++;
  }

  function decrement() {
    counter.value--;
  }

  return { counter, stars, increment, decrement };
}
