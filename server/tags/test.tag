<test>
  <p each="{v, i in outputs}">
    <span>
      {v}
    </span>
  </p>
  <form
    ref="inputform"
    onsubmit={evaluate}>
    <input
      value={default}
      class="evaluator"
      ref="input"
      type="text">
    </input>
  </form>

<script>
import vm from '../vm.js';

var self = this;
self.outputs = [];
self.default = "";

evaluate(ev) {
  ev.preventDefault();
  var input = self.refs.input;
  if (!input.value) {
    return;
  }
  else {
    try {
      self.outputs.push(JSON.stringify(vm.evaluateString(input.value)));
    }
    catch (e) {
      self.outputs.push(`Error: ${e.errormessage}`);
    }
  }
  self.refs.input.value = self.default;
  self.update();
}

</script>
</test>
