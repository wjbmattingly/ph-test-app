// tests/sample.test.js

import { mount } from '@vue/test-utils'
import SampleComponent from '~/components/SampleComponent.vue'

describe('SampleComponent.vue', () => {
  it('renders correctly', () => {
    const wrapper = mount(SampleComponent)
    expect(wrapper.text()).toContain('Hello, World!')
  })
})
