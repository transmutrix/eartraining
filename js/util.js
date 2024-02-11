
export function setLabel(id, text) {
  const el = document.getElementById(id);
  if (el)  el.innerHTML = text;
}

export function setError(text) {
  setLabel("error", text);
  throw new Error(text);
}

export function setSelectedButton(el, buttons) {
  for (const btn of buttons) {
    if (btn === el)  {
      btn.classList.remove("list-button");
      btn.classList.add("list-button-selected");
    } else {
      btn.classList.remove("list-button-selected");
      btn.classList.add("list-button");
    }
  }
}
