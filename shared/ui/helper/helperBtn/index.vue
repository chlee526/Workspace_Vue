<template>
    <div id="helperBtn" class="helperBtn" :style="getStyle">
        <a href="#" @click.prevent="evtClick">
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="22px" fill="#fff">
                <path d="M478-240q21 0 35.5-14.5T528-290q0-21-14.5-35.5T478-340q-21 0-35.5 14.5T428-290q0 21 14.5 35.5T478-240Zm-36-154h74q0-33 7.5-52t42.5-52q26-26 41-49.5t15-56.5q0-56-41-86t-97-30q-57 0-92.5 30T342-618l66 26q5-18 22.5-39t53.5-21q32 0 48 17.5t16 38.5q0 20-12 37.5T506-526q-44 39-54 59t-10 73Zm38 314q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
            </svg>
            <span>도움말</span>
        </a>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import EventBus from '@shared/utils/eventBus';

export default {
    name: 'comp-helper-btn',
    data() {
        return {
            isHide: false,
        };
    },
    computed: {
        ...mapGetters(['getUserHelperMenu', 'getHelperPos']),
        getMenuSeq() {
            return this.$route.query.helperSeq;
        },
        getStyle() {
            return {
                // left: this.getHelperPos >= 0 ? `${this.getHelperPos}px` : 'auto',
                // right: !this.getHelperPos ? `0` : 'auto',
                right: `${this.getHelperPos}px`,
            };
        },
        getHide() {
            return !this.getUserHelperMenu;
        },
    },
    mounted() {
        EventBus.$on('HELPER_OPEN', this.handleHelperOpen);
    },
    methods: {
        evtClick() {
            this.$store.dispatch('HELPER_OPEN', this.getMenuSeq);
        },
        handleHelperOpen(seq) {
            const url = `/#/view/helper/${seq}`;
            window.open(url, '_blank', 'width=1400,height=800');
        },
    },
};
</script>

<style lang="scss">
@import './style.scss';
</style>
