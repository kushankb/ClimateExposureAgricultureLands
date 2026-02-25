<script>
  let { href, title, description } = $props();
</script>

<a {href} class="nav-card">
  <h2>{title}</h2>
  <p>{description}</p>
</a>

<style>
  .nav-card {
    display: block;
    padding: 1.5rem 2rem;
    border: 1px solid #333;
    border-radius: 0.75rem;
    background: #111;
    color: inherit;
    text-decoration: none;
    transition: border-color 0.15s, background 0.15s;
    max-width: 320px;
  }

  .nav-card:hover {
    border-color: #888;
    background: #1a1a1a;
  }

  h2 {
    margin: 0 0 0.5rem;
    font-size: 1.1rem;
    font-weight: 600;
    color: #e0e0e0;
  }

  p {
    margin: 0;
    font-size: 0.875rem;
    color: #888;
    line-height: 1.5;
  }
</style>
