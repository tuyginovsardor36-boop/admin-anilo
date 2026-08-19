export interface Message {
  role: 'user' | 'agent';
  content: string;
}

export interface FileNode {
  name: string;
  content: string;
  language: string;
}
