const fs = require('fs');
const path = require('path');
const files = [
  'pages/Dashboard.js',
  'context/AuthContext.js',
  'hooks/useSocket.js',
  'components/ChatMessages.js',
  'components/DirectMessages.js',
  'components/ProfileModal.js',
  'components/SettingsModal.js',
  'components/VoiceVideoChannel.js',
  'components/Modals/AddFriendModal.jsx',
  'components/ChannelList.js'
];

files.forEach(file => {
  const p = path.join('c:/Users/prati/Downloads/codesvs/vyre/frontend/src', file);
  let content = fs.readFileSync(p, 'utf8');
  
  const original = content;

  // Add import if not present and we need it
  if (content.includes('http://localhost:5001')) {
    // calculate depth for relative import
    const depth = file.split(/[\\/]/).length - 1;
    let importPath = '';
    if (depth === 0) importPath = './config';
    else {
        let prefix = [];
        for(let i=0; i<depth; i++) prefix.push('..');
        importPath = prefix.join('/') + '/config';
    }
    
    // Check if we need both or just API_URL
    const needApi = content.includes('http://localhost:5001/api');
    const needWs = content.includes("io('http://localhost:5001')") || content.includes('io("http://localhost:5001")') || content.includes("io('http://localhost:5001'");
    
    let imports = [];
    if (needApi) imports.push('API_URL');
    if (needWs) imports.push('WS_URL');
    if (imports.length === 0) imports.push('API_URL'); // fallback

    const importStmt = "import { " + imports.join(', ') + " } from '" + importPath + "';\n";
    
    if (!content.includes(importPath)) {
        // insert after first import or at top
        const match = content.match(/import .*?;?\n/);
        if (match) {
            content = content.replace(match[0], match[0] + importStmt);
        } else {
            content = importStmt + content;
        }
    }

    // Replace literal template strings \`http://localhost:5001/api/... \` -> \`\${API_URL}/... \`
    content = content.replace(/`http:\/\/localhost:5001\/api(.*?)`/g, '`${API_URL}$1`');
    // Replace string concatenation 'http://localhost:5001/api' -> API_URL
    content = content.replace(/'http:\/\/localhost:5001\/api(.*?)'/g, (match, p1) => {
        if(p1) return '`${API_URL}' + p1 + '`';
        return `API_URL`;
    });
    
    // Handle WS_URL
    content = content.replace(/'http:\/\/localhost:5001'/g, 'WS_URL');
    content = content.replace(/'http:\/\/localhost:5001',/g, 'WS_URL,');

    if (content !== original) {
      fs.writeFileSync(p, content);
      console.log('Updated: ' + file);
    }
  }
});
