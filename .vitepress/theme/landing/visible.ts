import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

// True while the element is on screen. Diagrams run their animation only then, so a page full of
// looping diagrams costs nothing while they are scrolled away.
export function useVisible(el: Ref<Element | null>) {
  const visible = ref(false)
  let io: IntersectionObserver | null = null
  onMounted(() => {
    if (!el.value || typeof IntersectionObserver === 'undefined') {
      visible.value = true
      return
    }
    io = new IntersectionObserver(([e]) => (visible.value = e.isIntersecting), { threshold: 0.25 })
    io.observe(el.value)
  })
  onBeforeUnmount(() => io?.disconnect())
  return visible
}
