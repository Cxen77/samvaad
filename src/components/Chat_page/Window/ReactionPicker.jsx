function ReactionPicker({ emojis, onSelect, isMe }) {
  return (
    <div
      className={`absolute z-10 -top-12 flex gap-1 bg-white p-2 rounded-full shadow-lg border border-gray-200 ${
        isMe ? "left-0" : "right-0"
      }`}
    >
      {emojis.map((e) => (
        <button
          key={e}
          onClick={() => onSelect(e)}
          className="text-lg hover:scale-125 transition-transform"
        >
          {e}
        </button>
      ))}
    </div>
  );
}

export default ReactionPicker;
