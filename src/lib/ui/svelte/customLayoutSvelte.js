export default `
<script>
  import '../styles/globals.css'
  /**
   * @typedef {Object} Props
   * @property {import('svelte').Snippet} [children]
   */

  /** @type {Props} */
  let { children } = $props();
</script>
{@render children?.()}
`;
