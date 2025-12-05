//Copy this file to config.js and specify your own settings

export let ESCAPP_APP_SETTINGS = {
  //Settings that can be specified by the authors
  actionAfterSolve: "SHOW_MESSAGE", //actionAfterSolve can be "NONE" or "SHOW_MESSAGE".
  //message: "Custom message",
  dbUrl: "https://cdn.jsdelivr.net/gh/lerocha/chinook-database/ChinookDatabase/DataSources/Chinook_Sqlite.sqlite",
  question: "Write a SQL query that lists all Playlists.",
  title: "Challenge 1",
  initialQuery: "",
  theme: "brite",
  images: [
    "https://github.com/lerocha/chinook-database/assets/135025/cea7a05a-5c36-40cd-84c7-488307a123f4"
  ],
  tests: [
    {
      "id": "hasName",
      "description": "The output includes a 'Name' column.",
      "kind": "result",
      "fn": "({ columns }) => columns.includes('Name')"
    },
    {
      "id": "hasName",
      "description": "The output includes all playlists.",
      "kind": "result",
      "fn": "({ columns, rows }) => { const idx = columns.indexOf('Name'); console.log(idx); if (idx === -1) return false; return rows.some(r => String(r[idx]).toLowerCase().includes('audiobooks')); }"
    },
    {
      "id": "query_contains_playlists",
      "description": "The query contains the word 'playlists'",
      "fn": "({ query }) => /\\bPlaylist\\b/i.test(query)"
    }

  ],
  locale:"es",
  escappClientSettings: {
    endpoint:"https://escapp.es/api/escapeRooms/id",
    linkedPuzzleIds: [1],
    rtc: false,
    preview: false
  },
};