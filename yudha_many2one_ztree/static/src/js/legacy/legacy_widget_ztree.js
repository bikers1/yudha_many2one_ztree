odoo.define('yudha_many2one_ztree.WidgetzTree', function (require) {
    "use strict";


    var core = require('web.core');
    var Widget = require('web.Widget');
    var ztree_Max = 1000;

    var zTree = Widget.extend({
        className: 'ztree',
        template: 'App.zTree',
        init: function (setting, data) {
            this._super.apply(this, arguments);
            this.setting = {
                view: {
                    selectedMulti: true,
                    fontCss: function getFont(treeId, node) {
                        return node.font ? node.font : {};
                    },
                    nameIsHTML: true,
                    showIcon: false,
                    txtSelectedEnable: true,
                },
                data: {
                    key: {
                        title: "title"
                    },
                    simpleData: {
                        enable: true,
                    }
                }
            };
            if (setting)
                $.extend(this.setting, setting);

            //如果有定义zNodes，则直接按 zNodes数据展现，否则 rpc 取

            if (data.zNodes && data.zNodes.length)
                this.zNodes = data.zNodes;
            this.ztree_field = data.ztree_field;
            this.ztree_model = data.ztree_model;
            this.ztree_parent_key = data.ztree_parent_key;
            //todo: root_id，这个是节点的根id，用 parent_left < x < parent_right 实现，在 domain 增加值
            this.ztree_root_id = data.ztree_root_id;
            this.ztree_domain = data.ztree_domain;
            this.ztree_context = data.ztree_context ? data.ztree_context : session.user_context;
            this.order = data.order;
            this.ztree_selected_id = Number(data.ztree_selected_id);
            this.ztree_selected_vals = [];
            this.ztree_with_sub_node = data.ztree_with_sub_node;
            this.ztree_index = data.ztree_index;
            this.ztree_add_show_all = data.ztree_add_show_all;
            //默认2级
            this.ztree_expend_level = data.ztree_expend_level ? data.ztree_expend_level : 2;
            this.ztree_name_field = data.ztree_name_field;
            this.limit = data.limit > 0 ? data.limit : ztree_Max;
            this.ztree_id = 'ztree-' + this.guid();
            this.ztree_type = data.ztree_type;

        },
        willStart: function () {
            //数据初始化
            var self = this;
            var def;
            //不可用 ._rpc
            if (!self.zNodes || self.zNodes.length <= 0) {
                def = rpc.query({
                    model: self.ztree_model,
                    method: 'search_ztree',
                    kwargs: {
                        domain: self.ztree_domain,
                        context: self.ztree_context,
                        parent_key: self.ztree_parent_key,
                        root_id: self.ztree_root_id,
                        expend_level: self.ztree_expend_level,
                        name_field: self.ztree_name_field,
                        order: self.order,
                        limit: parseInt(self.limit? self.limit : ztree_Max),
                        //如果 type='chart'，要按 selected_id 得到 root_id 遍历
                        type: self.ztree_type,
                        selected_id: self.ztree_selected_id,
                    },
                }).then(function (result) {
                    var showall = [];
                    if (result.length > 0) {
                        self.zNodes = showall.concat(result);
                    }
                });
            }
            return $.when(this._super.apply(this, arguments), def);
        },
        start: function () {
            var self = this;
            this._super.apply(this, arguments);
            if (!self.$zTree) {
                self.$zTree = $.fn.zTree.init(self.$el, self.setting, self.zNodes);
                if (self.ztree_selected_id != null && self.ztree_selected_id > 0) {
                    var node = self.$zTree.getNodeByParam('id', self.ztree_selected_id, null);
                    self.$zTree.selectNode(node);
                }
            }
        },
        destroy: function () {
            if (this.$zTree) {
                this.$el.remove();
                this.$zTree = undefined;
            }
            this._super();
        },
        guid: function () {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },
        getChildNodes: function getChildNodes(treeNode) {
            var childNodes = this.$zTree.transformToArray(treeNode);
            var nodes = new Array();
            var i;
            for (i = 0; i < childNodes.length; i++) {
                nodes[i] = childNodes[i].id;
            }

            return nodes.join(",");
        }
    });

    return zTree;
})