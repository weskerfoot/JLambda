<test>
  <textarea
    cols=40
    rows=12
    ref="input"
    type="text">
  </textarea>
  <button
    onclick={evaluate}>
    Evaluate it
  </button>
  <p>
    {output}
  </p>

<script>
import vm from '../vm.js';

var self = this;
self.output = "";

evaluate() {
  var input = this.refs.input;
  self.update({"output" : JSON.stringify(vm.evaluateString(input.value))});
}

</script>
</test>
