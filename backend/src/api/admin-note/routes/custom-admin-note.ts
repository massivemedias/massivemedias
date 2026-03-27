export default {
  routes: [
    {
      method: 'GET',
      path: '/admin-notes/list',
      handler: 'admin-note.list',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/admin-notes/create',
      handler: 'admin-note.createNote',
      config: {
        auth: false,
      },
    },
    {
      method: 'PUT',
      path: '/admin-notes/:documentId',
      handler: 'admin-note.updateNote',
      config: {
        auth: false,
      },
    },
    {
      method: 'DELETE',
      path: '/admin-notes/:documentId',
      handler: 'admin-note.deleteNote',
      config: {
        auth: false,
      },
    },
  ],
};
