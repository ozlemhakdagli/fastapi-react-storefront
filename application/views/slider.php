	<section id="slider"><!--slider-->
		<div class="container">
			<div class="row">
				<div class="col-sm-12">
					<div id="slider-carousel" class="carousel slide" data-ride="carousel">
						<ol class="carousel-indicators">
							<li data-target="#slider-carousel" data-slide-to="0" class="active"></li>
							<?php foreach($slider as $rs){ ?>
							<li data-target="#slider-carousel" data-slide-to="1"></li>
							<?php }?>
						</ol>
						
						<div class="carousel-inner">
							<div class="item active">
								<div class="col-sm-6">
									
								<img src="<?=base_url()?>uploads/goz_at.png"  width="448" height="441" alt=""  />
									
								</div>
								<div class="col-sm-6">
									<img src="<?=base_url()?>uploads/yeni_urunler.gif"  width="448" height="441" alt=""  />
									
								</div>
							</div>
							<?php foreach($slider as $rs){ ?>
							<div class="item">
								<div class="col-sm-6">
									<a href="<?=base_url()?>home/urun_detay/<?=$rs->Id?>"> <h1><?=$rs->adi?></h1>	
									<p><?=$rs->kisa_aciklama?></p></a>
									
								</div>
								<div class="col-sm-6">
									<img src="<?=base_url()?>uploads/<?=$rs->resim?>" width="448" height="441"  alt="" />
									
								</div>
							</div>
							<?php }?>
							
							
						</div>
						
						<a href="#slider-carousel" class="left control-carousel hidden-xs" data-slide="prev">
							<i class="fa fa-angle-left"></i>
						</a>
						<a href="#slider-carousel" class="right control-carousel hidden-xs" data-slide="next">
							<i class="fa fa-angle-right"></i>
						</a>
					</div>
					
				</div>
			</div>
		</div>
	</section><!--/slider-->