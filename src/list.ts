import * as m from 'mithril';

interface ListNode {
    text: string;
    edited: boolean;
    children: List|null;
}

interface List {
    nodes: ListNode[];
}

export class ListComponent implements m.ClassComponent {
    list: List;
    editedNode: ListNode;

    constructor() {
        this.editedNode = {
            text: '',
            edited: true,
            children: null
        };
        this.list = {
            nodes: [this.editedNode]
        };
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

    renderNode(item: ListNode): m.Children {
        if (item.edited) {
            return m('input', {
                value: item.text,
                oninput: (e: InputEvent) => {
                    item.text = (e.target as HTMLInputElement).value;
                },
                onkeyup: (e: KeyboardEvent) => {
                    if (e.key !== 'Enter') {
                        return;
                    }

                    item.text = (e.target as HTMLInputElement).value;
                    item.edited = false;
                    this.createAfter(this.list, item);
                    e.preventDefault();
                }
            });
        }

        if (item.children == null) {
            return item.text;
        }

        return [
            item.text,
            this.renderList(item.children)
        ];
    }

    view() {
        return this.renderList(this.list);
    }
}
