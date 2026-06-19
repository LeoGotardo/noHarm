const ICONS = {
  home:    'M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10',
  friends: 'M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19M9.5 10.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM20 19v-1.4a3.5 3.5 0 0 0-2.6-3.4M15.5 4.7a3 3 0 0 1 0 5.8',
  chat:    'M5 5h14v10H9l-4 4V5Z',
  badges:  'M12 14.5 7.5 17l1-5.2L4.7 8l5.3-.7L12 2.5l2 4.8 5.3.7-3.8 3.8 1 5.2z',
  profile: 'M12 12.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1',
  check:   'M4 12.5 9 17.5 20 6.5',
  plus:    'M12 5v14M5 12h14',
  search:  'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-3.5-3.5',
  back:    'M15 4 7 12l8 8',
  send:    'M4 11.5 20 4l-7.5 16-2.2-6.3L4 11.5Z',
  lock:    'M6.5 10.5V8a5.5 5.5 0 0 1 11 0v2.5M5 10.5h14v9H5z',
  bell:    'M6 16V10a6 6 0 1 1 12 0v6l2 2H4l2-2ZM10 20a2 2 0 0 0 4 0',
  close:   'M6 6l12 12M18 6 6 18',
  edit:    'M4 20h4L19 9l-4-4L4 16v4ZM14 6l4 4',
  gear:    'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z M19.5 12a7.5 7.5 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-2-1.2l-.4-2.6h-4l-.4 2.6a7.6 7.6 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.6 7.6 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 0 0 2 1.2l.4 2.6h4l.4-2.6a7.6 7.6 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.06-.4.1-.8.1-1.2Z',
  logout:  'M14 8V5H5v14h9v-3M10 12h11M18 9l3 3-3 3',
  chevR:   'M9 5l7 7-7 7',
  history: 'M12 7v5l3 2M4 12a8 8 0 1 1 2.5 5.8M4 12H7M4 12V9',
  heart:   'M12 20s-7-4.5-7-9.5A3.5 3.5 0 0 1 12 7a3.5 3.5 0 0 1 7 3.5C19 15.5 12 20 12 20Z',
  block:   'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM5.6 5.6l12.8 12.8',
  trash:   'M5 7h14M9 7V5h6v2M6 7l1 13h10l1-13',
  flame:   'M12 3c1.5 3-1.5 4.5-1.5 7A2.5 2.5 0 0 0 13 12c.5-1 .3-2 .3-2 1.7 1.2 2.7 3 2.7 5a4 4 0 1 1-8 0c0-3 2-5 4-12Z',
  camera:  'M4 8h3l1.5-2h7L17 8h3v11H4zM12 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  share:   'M4 11.5 20 4l-7.5 16-2.2-6.3L4 11.5Z',
};

export function Icon({ name, size = 22, color = 'currentColor', sw = 1.8, fill = 'none', style }) {
  const d = ICONS[name] || '';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
      style={{ display: 'block', flexShrink: 0, ...style }}>
      {d.split(' M').map((seg, i) => (
        <path key={i} d={(i ? 'M' : '') + seg} stroke={color} strokeWidth={sw}
          strokeLinecap="round" strokeLinejoin="round" fill="none" />
      ))}
    </svg>
  );
}
