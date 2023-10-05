odoo.define('yudha_many2one_ztree.ztree_chart', function (require) {
"use strict";

    const fieldRegistry = require('web.field_registry');
    const { FieldOne2Many, FieldMany2One } = require('web.relational_fields');
    const AbstractField = require('web.AbstractField');
    const core = require('web.core');
    const rpc = require('web.rpc');
    const session = require('web.session');
    const _t = core._t;

    const FieldZTreeChart = AbstractField.extend({
        noLabel: true,
        supportedFieldTypes: ['one2many'],
        //todo: many2many
        template: 'App.FieldZtreeChart',
        SEARCH_MORE_LIMIT: 1000,

        init: function (parent, name, record, options) {
            this._super.apply(this, arguments);
            //初始参数，parent, name, record, options
            this.no_title = false;
            this.limit = this.attrs.limit ? this.attrs.limit : 1000;
            this.ztree_parent_key = this.nodeOptions.ztree_parent_key;
            this.ztree_root_id = this.nodeOptions.ztree_root_id;
            this.ztree_name_field = this.nodeOptions.ztree_name_field;
            this.order = this.nodeOptions.order;
            this.ztree_expend_level = this.nodeOptions.ztree_expend_level || 5;
        },
        _selectNode: function (event, item) {
            var self = this;
            var action = {};
            // console.log(arguments);
            event.stopImmediatePropagation();
            event.preventDefault();
            event.stopPropagation();
            var context = _.extend({}, self.context);
            var clear = parseInt(item.pId) > 0 ? false : true;
            if (item.id && item.id != self.res_id) {
                action = {
                    type: 'ir.actions.act_window',
                    view_mode: 'form',
                    views: [[false, 'form']],
                    target: 'current',
                    res_model: this.model,
                    res_id: item.id,
                    context: context,
                };
                return this.do_action(action, {clear_breadcrumbs: clear,});
            }
        },
        _renderEdit: function () {
            var self = this;
            //此处不可 domain，因为可以会造成树不全
            // var domain = self.record.getDomain(self.recordParams);
            var domain = [];
            // 用callback，不用url，更灵活
            var setting = {
                callback: {
                    onClick: function (event, treeId, treeNode) {
                        self._selectNode(event, treeNode);
                    }
                }
            };

            var $ztree = new zTree(setting, {
                    ztree_field: self.field.name,
                    ztree_model: self.field.relation,
                    ztree_domain: domain,
                    ztree_parent_key: self.ztree_parent_key,
                    ztree_root_id: self.ztree_root_id,
                    ztree_expend_level: self.ztree_expend_level,
                    ztree_name_field: self.ztree_name_field,
                    ztree_selected_id: self.record.res_id,
                    ztree_type: 'chart',
                }
            );
            $ztree.appendTo(this.$el.find('.ztree_chart'));
        },
        _renderReadonly: function () {
            this._renderEdit();
        },
    });
    fieldRegistry.add('ztree_chart', FieldZTreeChart);

    return FieldZTreeChart;
});

