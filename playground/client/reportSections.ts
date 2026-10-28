function createSection(body: HTMLElement, heading: Element): HTMLDetailsElement {
  const section = document.createElement('details');
  const summary = document.createElement('summary');
  summary.textContent = heading.textContent;
  section.appendChild(summary);
  body.replaceChild(section, heading);
  return section;
}

export function wrapVersionSections(body: HTMLElement): void {
  const children = [...body.children];
  let section: HTMLDetailsElement | null = null;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const nextChild = children[i + 1];
    const isVersionHeading = child.tagName === 'H2';
    const isDivider = child.tagName === 'HR' && nextChild !== undefined && nextChild.tagName === 'H2';
    const currentSection = section;
    const isInsideSection = currentSection !== null;
    if (isVersionHeading)
      section = createSection(body, child);
    else if (isDivider)
      section = null;
    else if (isInsideSection)
      currentSection.appendChild(child);
  }
}
