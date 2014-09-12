module Sass
  module Script
    module Functions
      def env(key)
        if ENV.has_key?(key.value)
          Sass::Script::String.new(ENV[key.value])
        else
          Sass::Script::Null.new
        end
      end
    end
  end
end
