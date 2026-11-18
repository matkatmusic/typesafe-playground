function createSection(body: HTMLElement, heading: Element): HTMLDetailsElement {
  const section = document.createElement('details');
  const summary = document.createElement('summary');
  summary.textContent = heading.textContent;
  section.appendChild(summary);
  body.replaceChild(section, heading);
  return section;
}

function appendChildToSection(body: HTMLElement, child: Element, nextChild: Element | undefined, section: HTMLDetailsElement | null): HTMLDetailsElement | null {
  const isVersionHeading = child.tagName === 'H2';
  const isDivider = child.tagName === 'HR' && nextChild !== undefined && nextChild.tagName === 'H2';
  const isInsideSection = section !== null;
  if (isVersionHeading)
    return createSection(body, child);
  if (isDivider)
    return null;
  if (isInsideSection)
    section.appendChild(child);
  return section;
}

export function wrapVersionSections(body: HTMLElement): void {
  const children = [...body.children];
  let section: HTMLDetailsElement | null = null;
  for (let i = 0; i < children.length; i++) {
    section = appendChildToSection(body, children[i], children[i + 1], section);
  }
}

