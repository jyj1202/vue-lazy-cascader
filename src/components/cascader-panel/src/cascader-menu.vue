<script>
import ElScrollbar from 'element-ui/packages/scrollbar';
import CascaderNode from './cascader-node.vue';
import Locale from 'element-ui/src/mixins/locale';
import { generateId, isEmpty } from 'element-ui/src/utils/util';

export default {
  name: 'ElCascaderMenu',

  mixins: [Locale],

  inject: ['panel'],

  components: {
    ElScrollbar,
    CascaderNode
  },

  props: {
    nodes: {
      type: Array,
      required: true
    },
    index: Number
  },

  data() {
    return {
      activeNode: null,
      hoverTimer: null,
      id: generateId()
    };
  },

  computed: {
    isEmpty() {
      return !this.nodes.length;
    },
    menuId() {
      return `cascader-menu-${this.id}-${this.index}`;
    }
  },

  methods: {
    handleExpand(e) {
      this.activeNode = e.target;
    },
    handleMouseMove(e) {
      const { activeNode, hoverTimer } = this;
      const { hoverZone } = this.$refs;

      if (!activeNode || !hoverZone) return;

      if (activeNode.contains(e.target)) {
        clearTimeout(hoverTimer);

        const { left } = this.$el.getBoundingClientRect();
        const startX = e.clientX - left;
        const { offsetWidth, offsetHeight } = this.$el;
        const top = activeNode.offsetTop;
        const bottom = top + activeNode.offsetHeight;

        hoverZone.innerHTML = `
          <path style="pointer-events: auto;" fill="transparent" d="M${startX} ${top} L${offsetWidth} 0 V${top} Z" />
          <path style="pointer-events: auto;" fill="transparent" d="M${startX} ${bottom} L${offsetWidth} ${offsetHeight} V${bottom} Z" />
        `;
      } else if (!hoverTimer) {
        this.hoverTimer = setTimeout(this.clearHoverZone, this.panel.config.hoverThreshold);
      }
    },
    clearHoverZone() {
      const { hoverZone } = this.$refs;
      if (!hoverZone) return;
      hoverZone.innerHTML = '';
    },

    renderEmptyText(h) {
      return (
        <div class="el-cascader-menu__empty-text">{ this.t('el.cascader.noData') }</div>
      );
    },
    renderNodeList(h) {
      const { menuId } = this;
      const { isHoverMenu } = this.panel;
      const events = { on: {} };

      if (isHoverMenu) {
        events.on.expand = this.handleExpand;
      }

      const nodes = this.nodes.map((node, index) => {
        const { hasChildren } = node;
        return (
          <cascader-node
            key={ node.uid }
            node={ node }
            node-id={ `${menuId}-${index}` }
            aria-haspopup={ hasChildren }
            aria-owns = { hasChildren ? menuId : null }
            { ...events }></cascader-node>
        );
      });

      return [
        ...nodes,
        isHoverMenu ? <svg ref='hoverZone' class='el-cascader-menu__hover-zone'></svg> : null
      ];
    },

    /**
     * menu触底处理
     */
    bindScrollbarListener() {
      this.$nextTick(() => {
        if (this.$refs.scrollbar.override) {
          return
        }
        this.$refs.scrollbar.handleScroll = () => {
          const wrap = this.$refs.scrollbar.wrap;
          this.$refs.scrollbar.moveY = (wrap.scrollTop * 100) / wrap.clientHeight;
          this.$refs.scrollbar.moveX = (wrap.scrollLeft * 100) / wrap.clientWidth;
          let poor = wrap.scrollHeight - wrap.clientHeight;
          if (
            poor == parseInt(wrap.scrollTop) ||
            poor == Math.ceil(wrap.scrollTop) ||
            poor == Math.floor(wrap.scrollTop)
          ) {
            let parentNode = this.nodes[0] && this.nodes[0].parent
            const resolve = (data) => {
              if (isEmpty(data)) return // 必须return，否则可能会死循环
              // append当前父节点中不存在的节点到
              const loadedVals = parentNode.children.map(n => n.getValue())
              const toAppendData = data.filter(d => !loadedVals.includes(d[this.panel.config.value]))
              if (toAppendData.length == 0) {
                this.$nextTick(() => {
                  this.$emit('menu-scroll-bottom', parentNode, resolve)
                })
                return
              }
              this.$parent.$parent.computePresentContent()
              toAppendData.forEach(d => {
                this.panel.store.appendNode(d, parentNode)
              })
              // 同步checkedValue到节点checked
              this.panel.syncMultiCheckState()
            }
            if (!parentNode) {
              console.warn('level1触底');
              return
            }
            this.$emit('menu-scroll-bottom', parentNode, resolve)
          }
        }
        this.$refs.scrollbar.override = true
      })
    }
  },

  mounted () {
    this.bindScrollbarListener();
  },

  render(h) {
    const { isEmpty, menuId } = this;
    const events = { nativeOn: {} };

    // optimize hover to expand experience (#8010)
    if (this.panel.isHoverMenu) {
      events.nativeOn.mousemove = this.handleMouseMove;
      // events.nativeOn.mouseleave = this.clearHoverZone;
    }

    return (
      <el-scrollbar
        ref="scrollbar"
        tag="ul"
        role="menu"
        id={ menuId }
        class="el-cascader-menu"
        wrap-class="el-cascader-menu__wrap"
        view-class={{
          'el-cascader-menu__list': true,
          'is-empty': isEmpty
        }}
        { ...events }>
        { isEmpty ? this.renderEmptyText(h) : this.renderNodeList(h) }
      </el-scrollbar>
    );
  }
};
</script>
