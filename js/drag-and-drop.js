function makeDraggable(elmnt, onPosChange) {
  let pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;

  setInterval(() => {
    moveInbounds();
  }, 3000);

  elmnt.classList.add("drag-enabled");
  elmnt.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    if (!elmnt.classList.contains("drag-enabled")) {
      return;
    }

    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    let top = elmnt.offsetTop - pos2;
    if (top < 0) {
      top = 0;
    }
    if (top + elmnt.offsetHeight > window.innerHeight) {
      top = window.innerHeight - elmnt.offsetHeight;
    }

    let left = elmnt.offsetLeft - pos1;
    if (left < 0) {
      left = 0;
    }
    if (left + elmnt.offsetWidth > window.innerWidth) {
      left = window.innerWidth - elmnt.offsetWidth;
    }

    elmnt.style.top = top + "px";
    elmnt.style.left = left + "px";

    onPosChange(top, left);
  }

  function closeDragElement() {
    /* stop moving when mouse button is released:*/
    document.onmouseup = null;
    document.onmousemove = null;
  }

  function moveInbounds() {
    let top = elmnt.offsetTop;
    if (top < 0) {
      top = 0;
    }
    if (top + elmnt.offsetHeight > window.innerHeight) {
      top = window.innerHeight - elmnt.offsetHeight;
    }

    let left = elmnt.offsetLeft;
    if (left < 0) {
      left = 0;
    }
    if (left + elmnt.offsetWidth > window.innerWidth) {
      left = window.innerWidth - elmnt.offsetWidth;
    }

    elmnt.style.top = top + "px";
    elmnt.style.left = left + "px";

    onPosChange(top, left);
  }
}
