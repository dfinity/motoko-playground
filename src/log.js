
export const output = document.createElement('div');

export function log(content) {
  const line = document.createElement('div');
  line.className = 'console-line';
  if (content instanceof Element) {
    line.appendChild(content);
  } else {
    line.innerText = content;
  }
  output.appendChild(line);
  return line;
}

export function clearLogs() {
  while (output.firstChild) {
    output.removeChild(output.firstChild);
  }
}
