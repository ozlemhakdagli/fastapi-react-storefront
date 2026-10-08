<section>
		<div class="container">
			<div class="row">
				<div class="col-sm-3">
					<div class="left-sidebar">
				
					
						
						<div class="panel-group category-products" id="accordian"><!--category-productsr-->
							<div class="panel panel-default">
								<div class="panel-heading">
									<h4 class="panel-title">
										<a data-toggle="collapse" data-parent="#accordian" href="#sportswear">
											<span class="badge pull-right"><i class="fa fa-plus"></i></span>
											Kategoriler
										</a>
									</h4>
									
								</div>
								<div id="sportswear" class="panel-collapse collapse">
									<div class="panel-body">
										<ul><?php foreach($kategoriler as $rs){ ?>
											<li><a href="<?=base_url()?>home/kategori/<?=$rs->Id?>"><?=$rs->adi?></a></li>
										<?php } ?>
										</ul>
									</div>
								</div>
							</div>
							<div class="panel panel-default">
								<div class="panel-heading">
									<h4 class="panel-title">
										<a data-toggle="collapse" data-parent="#accordian" href="#mens">
											<span class="badge pull-right"><i class="fa fa-plus"></i></span>
											Markalar
										</a>
									</h4>
								</div>
								<div id="mens" class="panel-collapse collapse">
									<div class="panel-body">
										<ul><ul><?php foreach($turu as $rs){ ?>
											<li><a href="<?=base_url()?>home/marka/<?=$rs->Id?>/"><?=$rs->adi?></a></li>
											<?php } ?>
										</ul>
									</div>
								</div>
							</div>
							
						
							
						</div><!--/category-products-->
					
						
						
						
						
						
					
					</div>
				</div>