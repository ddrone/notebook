import * as m from 'mithril';
import { check } from './utils';

interface ListNode {
    text: string;
    edited: boolean;
    children: List|null;
}

interface List {
    nodes: ListNode[];
}

interface NodeAttrs {
    node: ListNode;
    onEnter: (e: KeyboardEvent) => void;
    onTab: (e: KeyboardEvent) => void;
}

export class NodeComponent implements m.ClassComponent<NodeAttrs> {
    view(vnode: m.Vnode<NodeAttrs>): m.Children {
        const item = vnode.attrs.node;
        if (item.edited) {
            return m('input', {
                value: item.text,
                oninput: (e: InputEvent) => {
                    item.text = (e.target as HTMLInputElement).value;
                },
                onkeydown: (e: KeyboardEvent) => {
                    if (e.key === 'Tab') {
                        vnode.attrs.onTab(e);
                        e.preventDefault();
                    }
                },
                onkeyup: (e: KeyboardEvent) => {
                    if (e.key === 'Enter') {
                        item.text = (e.target as HTMLInputElement).value;
                        item.edited = false;
                        vnode.attrs.onEnter(e);
                        e.preventDefault();
                    }
                }
            });
        }

        return item.text;
    }

    oncreate(vnode: m.VnodeDOM<NodeAttrs, this>) {
        if (vnode.attrs.node.edited) {
            // DOM node should be an input, focus it.
            (vnode.dom as HTMLElement).focus();
        }
    }
}

const LOCAL_STORAGE_KEY = 'outliner-list';

export class ListComponent implements m.ClassComponent {
    list: List;

    constructor() {
        const saved = window.localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved !== null) {
            this.list = JSON.parse(saved);
        }
        else {
            this.list = {
                nodes: [{
                    text: '',
                    edited: true,
                    children: null
                }]
            };
        }

        window.addEventListener('beforeunload', () => {
            window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.list));
        });
    }

    renderList(list: List): m.Children {
        return m('ul',
            list.nodes.map(node => m('li', this.renderNode(node)))
        );
    }

    createAfter(list: List, node: ListNode): boolean {
        for (let i = 0; i < list.nodes.length; i++) {
            if (list.nodes[i] === node) {
                list.nodes.splice(i + 1, 0, {
                    text: '',
                    edited: true,
                    children: null
                });
                return true;
            }
            if (list.nodes[i].children !== null && this.createAfter(
                list.nodes[i].children, node
            )) {
                return true;
            }
        }
        return false;
    }

    dedent(node: ListNode) {
        for (let i = 0; i < this.list.nodes.length; i++) {
            if (this.list.nodes[i].children !== null && this.dedentWork(
                this.list, i, this.list.nodes[i].children, node
            )) {
                return;
            }
        }
    }

    dedentWork(parentList: List, parentIndex: number, list: List, needle: ListNode): boolean {
        for (let i = 0; i < list.nodes.length; i++) {
            if (list.nodes[i] === needle) {
                list.nodes.splice(i, 1);
                parentList.nodes.splice(parentIndex + 1, 0, needle);
                return true;
            }

            else if (list.nodes[i].children !== null) {
                if (this.dedentWork(list, i, list.nodes[i].children, needle)) {
                    return true;
                }
            }
        }

        return false;
    }

    indent(list: List, needle: ListNode): boolean {
        for (let i = 0; i < list.nodes.length; i++) {
            if (list.nodes[i] === needle) {
                if (i === 0) {
                    // No previous item in the list to attach the current one, just stop.
                    return true;
                }

                list.nodes.splice(i, 1);

                const previous = list.nodes[i - 1];
                if (previous.children === null) {
                    previous.children = {
                        nodes: []
                    };
                }
                previous.children.nodes.push(needle);
                return true;
            }

            else if (list.nodes[i].children !== null && this.indent(list.nodes[i].children, needle)) {
                return true;
            }
        }

        return false;
    }

    renderNode(item: ListNode): m.Children {
        const first = m(NodeComponent, check<NodeAttrs>({
            node: item,
            onEnter: (e) => {
                if (e.getModifierState("Shift")) {
                    if (item.children === null) {
                        item.children = {
                            nodes: []
                        };
                    }
                    item.children.nodes.push({
                        text: '',
                        edited: true,
                        children: null
                    });
                }
                else {
                    this.createAfter(this.list, item);
                }
            },
            onTab: (e) => {
                if (e.getModifierState("Shift")) {
                    this.dedent(item);
                }
                else {
                    this.indent(this.list, item);
                }
            }
        }));

        if (item.children == null) {
            return first;
        }

        return [
            first,
            this.renderList(item.children)
        ];
    }

    view() {
        return this.renderList(this.list);
    }
}
