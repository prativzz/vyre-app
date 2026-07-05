import ServerButton from './ServerButton';

export default function ServerSection({ servers, selectedServerId, onSelectServer }) {
  return (
    <div className="w-full flex-1 overflow-y-auto overflow-x-hidden pt-1 pb-3 space-y-3 flex flex-col items-center scrollbar-thin scrollbar-track-gray-800/50 scrollbar-thumb-gray-600">
      {servers.map((server) => (
        <ServerButton
          key={server.id}
          server={server}
          isActive={selectedServerId === server.id}
          onClick={() => onSelectServer(server)}
        />
      ))}
    </div>
  );
}