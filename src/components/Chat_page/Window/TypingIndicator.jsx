function TypingIndicator({ chat }) {
  return (
    <div className="flex items-start gap-3 px-4 pb-2">
      <img
        src={chat.avatar}
        alt="avatar"
        className="w-8 h-8 rounded-full ring-2 ring-gray-100"
      />
      <div className="px-4 py-2 rounded-2xl bg-white border border-gray-200 shadow-sm">
        <span className="italic text-gray-500 text-sm">typing...</span>
      </div>
    </div>
  );
}

export default TypingIndicator;
