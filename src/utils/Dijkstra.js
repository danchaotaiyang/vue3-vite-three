
// 初始化节点队列
class Queue {
    constructor() {
        this.items = [];
    }

    // 入列
    enqueue(element) {
        this.items.push(element);
    }

    // 判断队列是否为空
    isEmpty() {
        return this.items.length === 0;
    }
}

// 初始化节点数据
export class Dijkstra {
    constructor(nodes, start, end) {
        this.nodes = nodes; // 节点
        this.start = start; // 起点
        this.end = end; // 终点
        this.flow = []; // 最优路径
        this.queue = new Queue(); // 队列
        this.minDistance = Infinity;
    }

    // 计算最优路径方法
    calculate() {
        // 初始最优路径数组
        this.flow = [];

        // 初始化队列items数据
        for (const node of this.nodes) {
            this.queue.enqueue({
                name: node.name,
                distance: this.start === node.name ? 0 : Infinity,
                isChecked: false,
                lastNode: null,
                links: node.links,
                data: []
            });
        }

        // 计算距离start地点的distance
        // while判断items中是否有isChecked为false的（没有经过检查的节点），如果有则进行遍历
        while (this.queue.items.some((item) => !item.isChecked)) {
            // 筛选没有检查的节点，并按升序排序，即从小到大进行排序
            const tempList = this.queue.items.filter((item) => !item.isChecked).sort((a, b) => a.distance - b.distance);
            // 将距离最小的值设置为已检查
            tempList[ 0 ].isChecked = true;
            // 以距离最小的值为起始点，开始其下个相关联的节点
            tempList[ 0 ].links.forEach((link) => {
                // 在路径数组中查找未checked的，且与源点links中name相同的接点，目的是计算与当前checked的源点相关联的节点距离
                if (!this.queue.items.filter((item) => item.isChecked).find((item) => item.name === link.name)) {
                    // 获取该节点在路径数组中的索引位置，方便之后的数据定位
                    const index = this.queue.items.findIndex((value) => link.name === value.name);
                    // 获取该节点到源点的距离，该源点是上次筛选的最小距离节点，已设置为检查
                    const _distance = link.weight + tempList[ 0 ].distance;
                    // 判断该距离是否大于节点本身的距离
                    if (this.queue.items[ index ].distance > _distance) {
                        // 如果小于，则更新该节点的最小距离
                        this.queue.items[ index ].distance = link.weight + tempList[ 0 ].distance;
                        // 如果小于，则更新该节点最小距离的上一个节点名称
                        this.queue.items[ index ].lastNode = tempList[ 0 ].name;
                    }
                }
            });
        }

        // 将终点推入最优路径数组中
        this.flow.unshift(this.end);

        // 找到目的地后追溯至起点
        // 判断最优路径中是否有节点数据
        while (this.flow[ 0 ]) {
            // 如果有节点数据，在路径数组中找到该节点数据
            const lastNode = this.queue.items.find((item) => this.flow[ 0 ] === item.name);
            if (this.flow.length === 1) {
                this.minDistance = lastNode.distance;
            }
            this.flow.unshift(lastNode ? lastNode.lastNode : null);
        }

        this.flow.shift();
        return this.flow;
    }
}