function Tabs({ activeTab, onTabChange }) {
  return (
    <div className="flex px-4 py-2 border-b border-gray-200 flex-shrink-0">
      <button
        onClick={() => onTabChange('messages')}
        className={`flex-1 text-sm font-bold pb-2 border-b-2 transition-colors ${activeTab === 'messages' ? 'text-gray-900 border-sky-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
      >
        Messages
      </button>

      <button
        onClick={() => onTabChange('teams')}
        className={`
          flex-1 text-sm font-medium pb-2 border-b-2 transition-all 
          flex items-center justify-center gap-1
          ${activeTab === 'teams' ? 'text-gray-900 border-sky-600' : 'text-gray-500 border-transparent hover:text-gray-700'}
        `}
      >
        Team
      </button>
    </div>
  );
}

export default Tabs;
