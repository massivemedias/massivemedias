// Routes CRUD standard desactivees : on n'expose que la lecture publique
// (voir 01-instagram-post.ts). Aucune ecriture publique sur ce content-type,
// et le core router `find/create/update/delete` n'est pas enregistre.
export default { routes: [] };
