<test>
  <input
    ref="input"
    type="text">
  </input>
  <button
    onclick={evaluate}>
    Evaluate it
  </button>

<script>
import vm from '../vm.js';

evaluate() {
  var input = this.refs.input;
  alert(vm.evaluateString(input.value));
}

</script>
</test>
