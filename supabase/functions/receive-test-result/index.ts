// Retirée : le test de niveau se passe désormais directement sur le site (voir docs/backend-integration.md).
// Cette fonction ne répond plus qu'un statut 410 pour que l'ancienne URL n'accepte plus aucune donnée.

Deno.serve(
  () =>
    new Response(JSON.stringify({ error: "Intégration retirée : le test se passe désormais sur le site." }), {
      status: 410,
      headers: { "Content-Type": "application/json" },
    })
);
