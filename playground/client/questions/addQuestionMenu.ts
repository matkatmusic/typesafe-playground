import type { QuestionType } from './questionSnippets';

export type PickHandler = (type: QuestionType) => void;

interface MenuItem {
    type: QuestionType;
    title: string;
    description: string;
}

export function getMenuItems(): MenuItem[] {
    return [
        { type: 'noul', title: 'Noul', description: 'Evaluate how true something is' },
        { type: 'score', title: 'Score', description: 'Set up and grade with a rubric' },
        { type: 'choice', title: 'Choice', description: 'Ask a multiple choice question' },
    ];
}

function createTextSpan(className: string, text: string): HTMLSpanElement {
    const span = document.createElement('span');
    span.className = className;
    span.textContent = text;
    return span;
}

function createItemButton(item: MenuItem, onPick: PickHandler): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'add-question-item';
    button.append(createTextSpan('add-question-item-title', item.title));
    button.append(createTextSpan('add-question-item-desc', item.description));
    function selectItem(): void {
        onPick(item.type);
    }
    button.addEventListener('click', selectItem);
    return button;
}

export function createMenuElement(onPick: PickHandler): HTMLElement {
    const menu = document.createElement('div');
    menu.className = 'add-question-menu';
    menu.append(createTextSpan('add-question-menu-header', 'ADD QUESTION'));
    const menuItems = getMenuItems();
    for (let i = 0; i < menuItems.length; i++)
        menu.append(createItemButton(menuItems[i], onPick));
    return menu;
}

export function setMenuPosition(menu: HTMLElement, button: HTMLElement): void {
    const rect = button.getBoundingClientRect();
    const menuHeight = menu.offsetHeight;
    const roomBelow = window.innerHeight - rect.bottom;
    const fitsBelow = roomBelow >= menuHeight + 4;
    menu.style.left = rect.left + 'px';
    if (fitsBelow)
        menu.style.top = rect.bottom + 4 + 'px';
    else
        menu.style.top = Math.max(0, rect.top - menuHeight - 4) + 'px';
}

function createAddQuestionButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'add-question-btn';
    button.textContent = 'Add Question ⌄';
    return button;
}

class AddQuestionController {
    public readonly root: HTMLElement;
    public readonly button: HTMLButtonElement;
    public readonly menu: HTMLElement;
    public readonly onPick: PickHandler;

    public constructor(onPick: PickHandler) {
        this.onPick = onPick;
        this.root = document.createElement('div');
        this.root.className = 'add-question';
        this.button = createAddQuestionButton();
        this.menu = createMenuElement(this.selectAndClose);
        this.button.addEventListener('click', this.openMenu);
        this.root.append(this.button);
    }

    public closeMenu = (): void => {
        this.menu.remove();
        document.removeEventListener('mousedown', this.closeOnOutsideClick);
        document.removeEventListener('keydown', this.closeOnEscape);
    };

    public closeOnOutsideClick = (event: MouseEvent): void => {
        const target = event.target;
        if (!(target instanceof Node))
            throw new Error('mousedown target is not a node');
        const isInsideMenu = this.menu.contains(target);
        const isInsideRoot = this.root.contains(target);
        const isInside = isInsideMenu || isInsideRoot;
        if (isInside)
            return;
        this.closeMenu();
    };

    public closeOnEscape = (event: KeyboardEvent): void => {
        if (event.key === 'Escape')
            this.closeMenu();
    };

    public openMenu = (): void => {
        if (this.menu.isConnected)
            return;
        document.body.append(this.menu);
        setMenuPosition(this.menu, this.button);
        document.addEventListener('mousedown', this.closeOnOutsideClick);
        document.addEventListener('keydown', this.closeOnEscape);
    };

    public selectAndClose = (type: QuestionType): void => {
        this.closeMenu();
        this.onPick(type);
    };
}

export function createAddQuestionElement(onPick: PickHandler): HTMLElement {
    const controller = new AddQuestionController(onPick);
    return controller.root;
}
